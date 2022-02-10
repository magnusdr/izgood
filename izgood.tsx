import React, { useCallback, useEffect, useRef, useState } from "react";

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

    let validation_result = rule.validator(
      formdata instanceof FormData
        ? formdata.get(rule.name)
        : resolveProperty(formdata, rule.name)
    );
    if (typeof validation_result === "string" || validation_result === false) {
      errors.push({
        name: rule.name,
        message:
          rule.message ??
          (validation_result === false ? "Invalid input" : validation_result),
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
    let filtered_errors = errors;
    if (name) {
      filtered_errors = errors.filter((e) => e.name === name);
    }
    if (
      filtered_errors.length === 1 ||
      (filtered_errors.length > 1 && onlyFirstError)
    ) {
      return (
        <div className={`izgood-error ${className}`} {...restProps}>
          {filtered_errors[0].message}
        </div>
      );
    } else if (filtered_errors.length > 1) {
      return (
        <div className={`izgood-error ${className}`} {...restProps}>
          <ul>
            {filtered_errors?.map((e, i) => (
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
): typeof ErrorMessage {
  let errors = izgood(formdata, rules);

  return function (props: ErrorMessageProps) {
    return <ErrorMessage {...props} errors={errors} />;
  };
}

export function useErrorMessageLazy(
  rules: Rules
): [(d: FormData) => boolean, typeof ErrorMessage, boolean] {
  const [errors, set_errors] = useState<ValidationError[]>([]);

  const validate = useCallback(
    (formdata: FormData) => {
      let result = izgood(formdata, rules);
      set_errors(result);
      return result.length === 0;
    },
    [rules]
  );

  return [
    validate,
    function (props: ErrorMessageProps) {
      return <ErrorMessage {...props} errors={errors} />;
    },
    errors.length > 0,
  ];
}

/* 
 Built in validation functions
*/
export function izNotEmpty(value: any): string | boolean {
  if (typeof value === "object" && value?.size === 0) {
    return "This field cannot be empty";
  }

  const stripped_value =
    value && typeof value === "string" ? value.trim() : value;

  return value == null || stripped_value.length === 0
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
    if (key in data) {
      data = data[key];
    } else {
      return undefined;
    }
  }
  return data;
}
