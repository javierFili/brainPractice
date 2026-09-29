/**
 * How a challenge is answered, independently of what it shows. Every game reuses these formats,
 * so answer evaluation exists exactly once.
 *
 * `question` is what the player sees; `solution` is kept apart so a future server can evaluate
 * answers without ever sending the solution to the client.
 */
export interface ChoiceOption {
  readonly id: string;
  readonly label: string;
}

export interface ResponseFormats {
  /** Pick exactly one option. */
  'single-choice': {
    question: { readonly options: readonly ChoiceOption[] };
    solution: { readonly optionId: string };
    answer: { readonly optionId: string };
  };
  /** Arrange every item in the right order. */
  ordering: {
    question: { readonly items: readonly ChoiceOption[] };
    solution: { readonly order: readonly string[] };
    answer: { readonly order: readonly string[] };
  };
  /** Point at one element (line, record, cell) of the displayed content, by 0-based index. */
  locate: {
    question: { readonly itemCount: number };
    solution: { readonly index: number };
    answer: { readonly index: number };
  };
  /** Type an exact integer or decimal value. */
  numeric: {
    question: { readonly unit?: string };
    solution: { readonly value: number };
    answer: { readonly value: number };
  };
}

export type ResponseFormat = keyof ResponseFormats;

export type ResponseOf<F extends ResponseFormat> = {
  readonly format: F;
  readonly question: ResponseFormats[F]['question'];
  readonly solution: ResponseFormats[F]['solution'];
};

export type Response = { [F in ResponseFormat]: ResponseOf<F> }[ResponseFormat];

export type AnswerOf<F extends ResponseFormat> = {
  readonly format: F;
} & ResponseFormats[F]['answer'];

export type Answer = { [F in ResponseFormat]: AnswerOf<F> }[ResponseFormat];
