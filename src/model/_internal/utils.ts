import { Decoder, Errors } from "io-ts";
import { pipe } from "fp-ts/lib/function";
import * as IOE from "fp-ts/lib/IOEither";
import * as Console from "fp-ts/lib/Console";

const logErrors = (errors: Errors) => Console.error(errors);

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
      IOE.fromEither,
      IOE.swap,
      IOE.chainFirstIOK(logErrors),
      IOE.swap,
      IOE.mapLeft(errHandler)
    );
