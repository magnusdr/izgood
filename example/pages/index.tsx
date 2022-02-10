import type { NextPage } from "next";
import { useCallback } from "react";
import { izEmail, izNotEmpty, useErrorMessageLazy } from "izgood";

const Home: NextPage = () => {
  return <SignUpForm />;
};

export default Home;

function SignUpForm() {
  const [validate, ErrorMessage] = useErrorMessageLazy([
    ["username", izNotEmpty],
    ["username", izEmail],
    ["password", izNotEmpty, "An empty password would not be secure 👮"],
  ]);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();

      const formdata = new FormData(e.target);

      // Calling validate() will return false and update ErrorMessage if all rules did not pass
      if (!validate(formdata)) return;

      // ...POST request excluded for brevity
    },
    [validate]
  );

  return (
    <form onSubmit={handleSubmit}>
      <input name="username" />
      <ErrorMessage name="username" onlyFirstError />
      <input name="password" />
      <ErrorMessage name="password" style={{ color: "red" }} />
      <button>Sign up</button>
    </form>
  );
}
