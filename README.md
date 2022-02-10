# `izgood`

![Dog approves](media/dog.webp)

## Check if data `izgood` in three simple steps! ✨

1. Use React hook `const [validate, NotGood] = useNotGood(rules)`
1. Place the `<NotGood />` components where you want the error messages to appear
1. Use the `validate(formdata)` callback before submitting your form to the API. It returns `false` if data iz not good.

## Example usage

```jsx
import { useNotGood, izNotEmpty } from "izgood";

export default function GiftYourFriend() {
  const [validate, NotGood] = useNotGood([
    ["email", izNotEmpty],
    ["gift_code", izNotEmpty, "Empty gift iz kinda evil? 🙄"],
  ]);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();

      const formdata = FormData(e.target);
      if (validate(formdata)) {
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
        <input name="email" />
        <NotGood name="email" />
        <input name="gift_code" />
        <NotGood name="gift_code" />
      </form>
    </div>
  );
}
```

## API Reference

```js
const [validate, NotGood] = useNotGood(rules);
```

### `rules` format

Rules is a list of objects

```ts
type ValidationRule = {
  name: string; // The name of the <input /> field to validate
  whats_wrong: (value: any, args: any) => string | undefined;
  message?: string; // Optional custom error message
  args?: any; // Optional args object passed to whats_wrong
};
```

`whats_wrong` is the actual implementation of the validation. `izgood` comes with some built-in validation functions like `izNotEmpty`, but you can extend this easily by creating your own functions with the same signature `(value: any, args: any) => string | undefined`. Returning `undefined` means validation passed, `string` is the error message when validation fails.

Rules can also be a list of tuples (arrays) for shorter syntax

```ts
[
    string, // name
    (value: any, args: any) => string | undefined, // whats_wrong
    string?, // message
    any? // args
]
```

### The `validate` callback

`validate` has the following function signature:

```ts
function validate(formData: FormData): boolean;
```

It returns `fales` if validation failed, and `true` if all rules passed.

It is supported to use regular javascript objects instead of Formdata, but you have to do some dirty type casting.

```ts
validate(data as any);
```

Calling this function will trigger a re-rendering of your component, updating all the `<NotGood />` components.

### `<NotGood />` component

This component takes one property `name?: string`.

```jsx
<NotGood name="email" />
```

If you omit `name`, no filtering will be done, and all error messages will be displayed inside the component.

You can also pass any other property to the underlying `<div>` like `className`, `styles` etc.

Whether you choose to give this component an extra `className`s, it always has `notgood` as a class. It has no default styling. The class is simply there for easy selection in your global CSS styles like this

```css
/* global.css */

.notgood {
  color: red;
}
```
