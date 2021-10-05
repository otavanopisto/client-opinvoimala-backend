"use strict";

const crypto = require("crypto");

module.exports = {
  /**
   * By default, creates an SHA-256 hash from a given value (string)
   *
   * DO NOT USE THIS FOR, E.G., PASSWORDS!
   * -> Since the hash will always be the same for the same input.
   * This is a good thing when we want to be able to query & compare, e.g.,
   * hashed email addresses, which is why this function was made in the first place.
   */
  hashValue(value, algorithm = "sha256") {
    return new Promise((resolve, reject) => {
      if (!value || this.isHashed(value)) {
        resolve(null);
      } else {
        const secret =
          process.env.AUTH_HASH_SECRET ?? "QsaPws2jjbP9MpAfgrubEnCq";

        const hash = crypto
          .createHmac(algorithm, secret)
          .update(value)
          .digest("hex");

        resolve(hash);
      }
    });
  },
};
