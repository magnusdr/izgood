# `izgood`

![Dog approves](media/dog.webp)

## Check if data `izgood` in three simple steps! ✨

1. Use React hook `const [validate, { ErrorMessage }] = useValidationLazy(rules)`
1. Place the `<ErrorMessage />` components where you want the error messages to appear
1. Use the `validate(formdata)` callback before submitting your form to the API. It returns `false` if data iz not good.

Replace `useValidationLazy(rules)` with `useValidation(rules)` if you want validation on each render!

> _No dependencies and tiny bundle size ([1.4kB minified + gzipped](https://bundlephobia.com/package/izgood))! 🧑‍💻_

## API Reference 📝

### `type Rules`

```ts
type ValidationRule = {
  name: string; // Name or path to the validation value (eg. "user.email" or "firstName")
  validator: (value: any) => string | boolean;
  errorMessage?: string; // Optional custom error message
};

type ValidationRuleTuple = [
  name: string,
  validator: (value: any) => string | boolean,
  errorMessage?: string
];

type Rules = (ValidationRule | ValidationRuleTuple)[];
```

`izgood` comes with some built-in `validator` functions:

- `izNotEmpty`,
- `izEmail`
- `izMoreThan(min: number)`
- ...you can easily extend this list by creating your own functions with the same signature `(value: any) => string | boolean`.
  - `true` = input is valid.
  - `string | false` = invalid input.

### `function useValidation()`

```ts
function useValidation(
  data: any,
  rules: ValidationRule[]
): {
  ErrorMessage: (props: ErrorMessageProps) => JSX.Element;
  hasErrors: (name?: string) => boolean;
  getStrings: (name?: string) => string[];
};
```

### `function useValidationLazy()`

```ts
function useValidationLazy(rules: ValidationRule[]): [
  validate: (data: any, name?: string) => boolean,
  {
    ErrorMessage: (props: ErrorMessageProps) => JSX.Element;
    hasErrors: (name?: string) => boolean;
    getStrings: (name?: string) => string[];
  }
];
```

- Specify a `name: string` on validation to only validate a single part of the data

## Examples

### Validating nested properties in data

The simplest approach is to wrap the validator function like so:

```ts
const data = {
  user: {
    email: "john.doe@example.com",
  },
};

const validationResult = useValidation(data, [
  ["user", (u) => izEmail(u.email), "Please enter a valid email address"],
]);
```

This will however put the errors on `"user"` instead of `"user.email"` (because `rule.name === "user"`).

If you want more granular error message selection when validating nested properties, you could also go for a more modular approach by creating reusable validation hooks. The `validate` function returned from `useValidationLazy` can in fact be used as a rule inside another `useValidationLazy` hook, like this:

```tsx
// The object we want to validate (a money transaction)
const transactionData = {
  sender: {
    email: "john.doe@example.com",
    fullName: "John Doe",
    age: 29,
  },
  receiver: {
    email: "jane.smith@example.com",
    fullName: "Jane Smith",
    age: 38,
  },
  value: 100,
};

// Custom hook for validating user objects (both sender and receiver)
const useUserValidationLazy = () =>
  useValidationLazy([
    ["email", izEmail],
    ["age", izMoreThan(13), "User has to be 13 years or older!"],
  ]);

// MyTransactionForm.tsx
import { useValidationLazy, izNotEmpty, izMoreThan } from "izgood";

export default function MyTransactionForm({ transactionData }) {
  const [izSenderGood, { ErrorMessage: SenderErrorMessage }] =
    useUserValidationLazy();
  const [izReceiverGood, { ErrorMessage: ReceiverErrorMessage }] =
    useUserValidationLazy();

  const [validate, { ErrorMessage: TransactionErrorMessage }] =
    useValidationLazy([
      ["sender", izSenderGood], // <--  The `validate` functions returned from useUserValidationLazy
      ["receiver", izReceiverGood], //  used as a rule in this useValidationLazy hook 💁‍♂️ 🪄
      ["value", izMoreThan(0), "Value must be more than 0"],
    ]);

  // Run the validation, causing the nested validation modules to be executed as well
  const handleValidate = useCallback(() => {
    validate(transactionData);
  }, [validate, transactionData]);

  return (
    <div>
      <button onClick={handleValidate}>Validate</button>
      <SenderErrorMessage name="email" /> {/* <-- This will only render errors on "sender.email" 💡 */}
      {/* Other render logic hidden for brevity */}
    </div>
  );
}
```

This way, you can render `<SenderErrorMessage name="email" />` to precisely get the error message on `"sender.email"`, instead of bundling up all messages in the same `<TransactionErrorMessage name="sender" />`, rendering both `"age"` and `"email"` errors.
