"use client";

type ErrorProps = {
  error: Error;
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  return (
    <main>
      <h1>Ocorreu um erro.</h1>

      <p>{error.message}</p>

      <button onClick={reset}>Tentar novamente</button>
    </main>
  );
}
