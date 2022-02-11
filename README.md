# `izgood`

![Dog approves](media/dog.webp)

## Check if data `izgood` in three simple steps! ✨

1. Use React hook `const [validate, ErrorMessage] = useErrorMessageLazy(rules)`
1. Place the `<ErrorMessage />` components where you want the error messages to appear
1. Use the `validate(formdata)` callback before submitting your form to the API. It returns `false` if data iz not good.

Replace `useErrorMessageLazy(rules)` with `useErrorMessage(rules)` if you want validation update on each render!

## Example usage

```jsx
import { useErrorMessageLazy, izNotEmpty } from "izgood";

export default function GiftYourFriend() {
  const [validate, ErrorMessage] = useErrorMessageLazy([
    ["email", izNotEmpty],
    ["gift_code", izNotEmpty, "Empty gift iz kinda evil? 🙄"],
  ]);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();

      const formdata = FormData(e.target);
      if (!validate(formdata)) {
        return;
      }

      // ...API request hidden for brevity
    },
    [validate]
  );

  return (
    <div>
      <h1>Send a gift to your friend!</h1>
      <form onSubmit={handleSubmit}>
        {/* Sprinkle beautiful error messages around 
            your form */}
        <input name="email" />
        <ErrorMessage name="email" />
        <input name="gift_code" />
        <ErrorMessage name="gift_code" />

        {/* Or, you could just omit "name" to get 
            all errors in one list at the bottom */}
        <ErrorMessage />
      </form>
    </div>
  );
}
```

If you prefer doing the validation on render instead of invoking `validate` manually, you could use underlying `useErrorMessage(formdata, rules)` or `useErrorStrings(formdata, rules)` directly instead.

This could be handy if you render a final summary of your superlarge form in a new dialog/modal that simply gets the FormData as a prop from a parent component.

```jsx
import { useErrorStrings, izNotEmpty } from "izgood";

export default function GiftSummary({ formdata }) {
  const errors = useErrorStrings(formdata, [
    ["email", izNotEmpty],
    ["gift_code", izNotEmpty, "Empty gift iz kinda evil? 🙄"],
  ]);

  return (
    <div>
      <h1>Summary of your gift</h1>
      {/* ...some fancy UI summarizing form */}
      {errors.map((e) => (
        <div>{e}</div>
      ))}
      <button disabled={errors.length > 0}>Submit</button>
    </div>
  );
}
```

## API Reference

```js
const [validate, ErrorMessage, isInvalid, hasError] =
  useErrorMessageLazy(rules);

// or, for running validation on render
const [ErrorMessage, isInvalid, hasError] = useErrorMessage(formdata, rules);

// or, if you want error strings instead of component
const errors = useErrorStrings(formdata, rules);
```

### `rules` format

Rules is a list of objects

```ts
type ValidationRule = {
  name: string; // The name of the <input /> field to validate
  validator: (value: any) => string | boolean;
  message?: string; // Optional custom error message
};
```

`validator` is the actual implementation of the validation. `izgood` comes with some built-in validation functions like `izNotEmpty`, but you can extend this easily by creating your own functions with the same signature `(value: any) => string | boolean`.

Returning `false` or a `string` means validation failed. The returned `string` will be used as error message if no message was specified in the rule.

Rules can also be a list of tuples (arrays) for shorter syntax

```ts
[
    string, // name
    (value: any) => string | boolean, // validator
    string?, // message
]
```

### The `validate` callback

`validate` has the following function signature:

```ts
function validate(formData: FormData): boolean;
```

It returns `false` if validation failed, and `true` if all rules passed.

It is supported to use regular javascript objects instead of Formdata, but you have to do some dirty type casting.

```ts
validate(data as any);
```

Calling this function will trigger a re-render of the ErrorMessage, automatically updating your form with beautiful error messages.

### `<ErrorMessage />` component

This component takes two properties `name?: string` and `onlyFirstError?: boolean`.

```jsx
<ErrorMessage name="email" onlyFirstError />
```

If you omit `name`, no filtering will be done, and all error messages will be displayed in a list (`<ul>`) inside the component.

`onlyFirstError` makes sure only the first error message is displayed. This makes sense if you have consequential errors in the validation. If you for example first check if email is empty, and then check if the email is valid, the invalidity is a consequence of the field being empty, obviously not providing any value to the user displaying the second message.

You can also pass any other property to the underlying `<div>` like `className`, `styles` etc.

Whether you choose to give this component an extra `className`s, it always has `izgood-error` as a class. It has no default styling. The class is simply there for easy selection in your global CSS styles like this

```css
/* global.css */

.izgood-error {
  color: red;
}
```

### The `hasError` callback

`validate` has the following function signature:

```ts
function hasError(name: string): boolean;
```

It can be used to conditionally render things based on validity of one field, instead of the total validity
