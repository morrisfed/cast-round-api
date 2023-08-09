import { Decoder, Errors, Validation } from "io-ts";
import { PathReporter } from "io-ts/PathReporter";
import { flow, pipe } from "fp-ts/lib/function";
import * as IOE from "fp-ts/lib/IOEither";
import * as IO from "fp-ts/lib/IO";
import * as A from "fp-ts/lib/Array";
import * as Console from "fp-ts/lib/Console";

const logValidationErrors = <A>(
  validation: Validation<A>
): IOE.IOEither<Errors, A> =>
  pipe(
    IO.of(validation),
    IO.chainFirst(
      flow(PathReporter.report, A.map(Console.error), IO.sequenceArray)
    )
  );

// Strict and exact IO-TS decoders rely on the object being have superfluous properties removed
// to report their properties through Object.getOwnProperties(...).
// Objects built by sequelize do not have any own properties related to their model columns, meaning
// io-ts decoders will fail to decode them.
// To work around this, serialise objects to a JSON string and then parse them back to an object before
// decoding with io-ts.
export const decodePersistedIOE =
  <I, A, ErrT>(decoder: Decoder<I, A>) =>
  (errHandler: (errors: Errors) => ErrT) =>
  (input: I): IOE.IOEither<ErrT, A> =>
    pipe(
      input,
      JSON.stringify,
      JSON.parse,
      decoder.decode,
      logValidationErrors,
      IOE.mapLeft(errHandler)
    );
