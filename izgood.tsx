import React, { useCallback, useState } from "react";

type ValidationRule = {
  name: string;
  whats_wrong: (value: any, args: any) => string | undefined;
  message?: string;
  args?: any;
};

type ValidationRuleTuple = [
  string,
  (value: any, args: any) => string | undefined,
  string?,
  any?
];

type Rules = (ValidationRule | ValidationRuleTuple)[];

type FormError = {
  name: string;
  message: string;
};

function izgood(formdata: FormData, rules: Rules): FormError[] | undefined {
  let errors: FormError[] = [];

  for (let i = 0; i < rules.length; i++) {
    let rule = rules[i];
    if (Array.isArray(rule)) {
      rule = {
        name: rule[0],
        whats_wrong: rule[1],
        message: rule[2],
        args: rule[3],
      };
    }

    let err_msg = rule.whats_wrong(
      formdata instanceof FormData
        ? formdata.get(rule.name)
        : formdata[rule.name],
      rule.args
    );
    if (err_msg) {
      errors.push({
        name: rule.name,
        message: rule.message ?? err_msg,
      });
    }
  }

  return errors.length === 0 ? undefined : errors;
}

type NotGoodProps = {
  name?: string;
  errors?: FormError[];
  className?: string;
  [key: string]: any;
};

function NotGood({ name, errors, className, ...restProps }: NotGoodProps) {
  if (name === undefined) {
    return (
      <div className={`notgood ${className}`} {...restProps}>
        <ul>
          {errors?.map((e) => (
            <li>{e.message}</li>
          ))}
        </ul>
      </div>
    );
  } else if (errors) {
    let my_err = errors.filter((e) => e.name === name)?.[0];
    if (my_err) {
      return (
        <div className={`notgood ${className}`} {...restProps}>
          {my_err.message}
        </div>
      );
    }
  }
  return <></>;
}

export default function useNotGood(
  rules: Rules
): [(d: FormData) => boolean, typeof NotGood] {
  const [errors, set_errors] = useState<FormError[] | undefined>();

  const validate = useCallback(
    (formdata: FormData) => {
      let result = izgood(formdata, rules);
      if (result === undefined) {
        return true;
      } else {
        set_errors(result);
        return false;
      }
    },
    [rules]
  );

  return [
    validate,
    function ({ name, ...restProps }: NotGoodProps) {
      return <NotGood name={name} errors={errors} {...restProps} />;
    },
  ];
}

/* 
 Built in validation functions
*/
export function izNotEmpty(value: any, args: any): string | undefined {
  if (typeof value === "object" && value?.size === 0) {
    return "This field cannot be empty";
  }

  const stripped_value =
    value && typeof value === "string" ? value.trim() : value;

  return value == null || stripped_value.length === 0
    ? "This field cannot be empty"
    : undefined;
}

export function izEmail(value: any, args: any): string | undefined {
  const regex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

  if (typeof value === "string" && value.match(regex)) {
    return undefined;
  } else {
    return "Invalid email address";
  }
}

export function izMoreThan(value: any, args: any): string | undefined {
  const valueAsNumber = parseInt(value);

  if (valueAsNumber !== NaN) {
    if (args.min != null && valueAsNumber < args.min) {
      return `This has to be minimum ${args.min}`;
    } else {
      return undefined;
    }
  } else {
    return `This has to be minimum ${args.min}`;
  }
}
