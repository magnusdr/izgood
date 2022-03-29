import React, { HTMLAttributes, useCallback, useState } from "react";

type ValidationRule<Keys, T> = {
  name: Keys;
  validator: ValidatorFunction<T>;
  message?: string;
};
type ValidatorFunction<T> = (value: T) => ValidatorResult;
type ValidatorResult = boolean;

type ValidationRuleTuple<Keys, T> = [
  name: Keys,
  validator: ValidatorFunction<T>,
  errorMessage?: string
];

type Rules<Keys> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (ValidationRule<Keys, any> | ValidationRuleTuple<Keys, any>)[];

type ErrorMessageProps = {
  errors?: ValidationError[];
  name?: string;
  onlyFirstError?: boolean;
  className?: string;
} & HTMLAttributes<HTMLDivElement>;

function ErrorMessage({
  errors,
  name,
  onlyFirstError,
  className,
  ...restProps
}: ErrorMessageProps) {
  if (errors) {
    let filteredErrors = errors;
    if (name) {
      filteredErrors = errors.filter((e) => e.name === name);
    }
    if (
      filteredErrors.length === 1 ||
      (filteredErrors.length > 1 && onlyFirstError)
    ) {
      return (
        <div className={`izgood-error ${className}`} {...restProps}>
          {filteredErrors[0].message}
        </div>
      );
    } else if (filteredErrors.length > 1) {
      return (
        <div className={`izgood-error ${className}`} {...restProps}>
          <ul>
            {filteredErrors?.map((e, i) => (
              <li key={i}>{e.message}</li>
            ))}
          </ul>
        </div>
      );
    }
  }
  return <></>;
}

type ValidationError = {
  name: string;
  message: string;
};

function findErrors<T>(data: T, rules: Rules<keyof T>): ValidationError[] {
  const errors: ValidationError[] = [];

  for (let i = 0; i < rules.length; i++) {
    let rule = rules[i];

    // Convert ValidationRuleTuple to ValidationRule
    if (Array.isArray(rule)) {
      rule = {
        name: rule[0],
        validator: rule[1],
        message: rule[2],
      };
    }

    const validationResult = rule.validator(
      data instanceof FormData ? data.get(rule.name as string) : data[rule.name]
    );
    if (!validationResult) {
      errors.push({
        name: rule.name as string,
        message: rule.message ?? "Invalid input",
      });
    }
  }

  return errors;
}

export function useValidationLazy<T extends { [key: string]: unknown }>(
  rules: Rules<keyof T>
): [
  validate: (data: T, name?: string) => boolean,
  result: {
    ErrorMessage: (props: ErrorMessageProps) => JSX.Element;
    hasErrors: (name?: string) => boolean;
    getStrings: (name?: string) => string[];
  }
] {
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const validate = useCallback(
    (data: T, name?: string) => {
      if (name) {
        const result = findErrors(data ?? {}, rules);
        const filteredResult = result.filter((e) => e.name === name);
        setErrors((old) => {
          return [...old.filter((e) => e.name !== name), ...filteredResult];
        });
        return result.length === 0;
      } else {
        const result = findErrors(data ?? {}, rules);
        setErrors(result);
        return result.length === 0;
      }
    },
    [rules]
  );

  const hasErrors = useCallback(
    (name?: string) => {
      if (name) {
        return errors.filter((e) => e.name === name).length > 0;
      } else {
        return errors.length > 0;
      }
    },
    [errors]
  );

  const getStrings = useCallback(
    (name?: string) => {
      if (name) {
        return errors.filter((e) => e.name === name).map((e) => e.message);
      } else {
        return errors.map((e) => e.message);
      }
    },
    [errors]
  );

  return [
    validate,
    {
      ErrorMessage: function (props: ErrorMessageProps) {
        return <ErrorMessage {...props} errors={errors} />;
      },
      hasErrors,
      getStrings,
    },
  ];
}

export function useValidation<T extends { [key: string]: unknown }>(
  data: T,
  rules: Rules<keyof T>
) {
  const errors = findErrors(data ?? {}, rules);

  const hasErrors = useCallback(
    (name?: string) => {
      if (name) {
        return errors.filter((e) => e.name === name).length > 0;
      } else {
        return errors.length > 0;
      }
    },
    [errors]
  );

  const getStrings = useCallback(
    (name?: string) => {
      if (name) {
        return errors.filter((e) => e.name === name).map((e) => e.message);
      } else {
        return errors.map((e) => e.message);
      }
    },
    [errors]
  );

  return {
    ErrorMessage: function (props: ErrorMessageProps) {
      return <ErrorMessage {...props} errors={errors} />;
    },
    hasErrors,
    getStrings,
  };
}

/* 
 Built in validation functions
*/
export function izNotEmpty(value: string | File): ValidatorResult {
  if (typeof value === "string") {
    const strippedValue =
      value && typeof value === "string" ? value.trim() : value;

    return value == null || strippedValue.length === 0 ? false : true;
  } else if (value instanceof File) {
    if (value?.size === 0) {
      return false;
    } else {
      return true;
    }
  } else {
    return false;
  }
}

export function izEmail(value: string): ValidatorResult {
  const regex = /^\S+@\S+\.\S+$/;

  if (typeof value === "string" && value.match(regex)) {
    return true;
  } else {
    return false;
  }
}

export const izMoreThan =
  (min: number) =>
  (value: number | string): ValidatorResult => {
    const valueAsNumber = typeof value === "string" ? parseInt(value) : value;

    if (!isNaN(valueAsNumber)) {
      if (valueAsNumber <= min) {
        return false;
      } else {
        return true;
      }
    } else {
      return false;
    }
  };
