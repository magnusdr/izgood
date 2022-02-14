import React, { useCallback, useState } from "react";

type ValidationRule = {
  name: string;
  validator: (value: any) => string | boolean;
  message?: string;
};

type ValidationRuleTuple = [string, (value: any) => string | boolean, string?];

type Rules = (ValidationRule | ValidationRuleTuple)[];

export type ValidationError = {
  name: string;
  message: string;
};

export function izgood(formdata: FormData, rules: Rules): ValidationError[] {
  let errors: ValidationError[] = [];

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

    let validationResult = rule.validator(
      formdata instanceof FormData
        ? formdata.get(rule.name)
        : resolveProperty(formdata, rule.name)
    );
    if (typeof validationResult === "string" || validationResult === false) {
      errors.push({
        name: rule.name,
        message:
          rule.message ??
          (validationResult === false ? "Invalid input" : validationResult),
      });
    }
  }

  return errors;
}

type ErrorMessageProps = {
  errors?: ValidationError[];
  name?: string;
  onlyFirstError?: boolean;
  className?: string;
  [key: string]: any;
};

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

export function useErrorStrings(formdata: FormData, rules: Rules): string[] {
  let errors = izgood(formdata, rules);

  return errors.map((e) => e.message);
}

export function useErrorMessage(
  formdata: FormData,
  rules: Rules
): [typeof ErrorMessage, boolean, (name: string) => boolean] {
  let errors = izgood(formdata, rules);

  const hasError = useCallback(
    (name: string) => {
      return errors.filter((e) => e.name === name).length > 0;
    },
    [errors]
  );

  return [
    function (props: ErrorMessageProps) {
      return <ErrorMessage {...props} errors={errors} />;
    },
    errors.length > 0,
    hasError,
  ];
}

export function useErrorMessageLazy(
  rules: Rules
): [
  (d: FormData, name?: string) => boolean,
  typeof ErrorMessage,
  boolean,
  (name: string) => boolean
] {
  const [errors, setErrors] = useState<ValidationError[]>([]);

  const validate = useCallback(
    (formdata: FormData, name?: string) => {
      if (name) {
        let result = izgood(formdata, rules);
        let filteredResult = result.filter((e) => e.name === name);
        setErrors((old) => {
          return [...old.filter((e) => e.name !== name), ...filteredResult];
        });
        return result.length === 0;
      } else {
        let result = izgood(formdata, rules);
        setErrors(result);
        return result.length === 0;
      }
    },
    [rules]
  );

  const hasError = useCallback(
    (name: string) => {
      return errors.filter((e) => e.name === name).length > 0;
    },
    [errors]
  );

  return [
    validate,
    function (props: ErrorMessageProps) {
      return <ErrorMessage {...props} errors={errors} />;
    },
    errors.length > 0,
    hasError,
  ];
}

/* 
 Built in validation functions
*/
export function izNotEmpty(value: any): string | boolean {
  if (typeof value === "object" && value?.size === 0) {
    return "This field cannot be empty";
  }

  const strippedValue =
    value && typeof value === "string" ? value.trim() : value;

  return value == null || strippedValue.length === 0
    ? "This field cannot be empty"
    : true;
}

export function izEmail(value: any): string | boolean {
  const regex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

  if (typeof value === "string" && value.match(regex)) {
    return true;
  } else {
    return "Invalid email address";
  }
}

export const izMoreThan =
  (min: number) =>
  (value: any): string | boolean => {
    const valueAsNumber = parseInt(value);

    if (!isNaN(valueAsNumber)) {
      if (valueAsNumber <= min) {
        return `Number has to be minimum ${min}`;
      } else {
        return true;
      }
    } else {
      return `This is an invalid number. Enter a number larger than ${min}.`;
    }
  };

/* 
    Helper function to access nested object properties by string
    Like this: resolveProperty(data, "user.contact.email")
*/
function resolveProperty(data: any, path: string) {
  path = path.replace(/\[(\w+)\]/g, ".$1"); // convert indexes to properties
  path = path.replace(/^\./, ""); // strip a leading dot
  var parts = path.split(".");
  for (var i = 0, n = parts.length; i < n; ++i) {
    var key = parts[i];
    if (data != null && data === Object(data) && key in data) {
      data = data[key];
    } else {
      return undefined;
    }
  }
  return data;
}
