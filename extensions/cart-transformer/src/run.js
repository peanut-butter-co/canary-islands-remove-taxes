// @ts-check

/*
A straightforward example of a function that expands a bundle into its component parts.
The parts of a bundle are stored in a metafield on the product parent value with a specific format,
specifying each part's quantity and variant.

The function reads the cart. Any item containing the metafield that specifies the bundle parts
will return an Expand operation containing the parts.
*/

/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 * @typedef {import("../generated/api").CartOperation} CartOperation
 */

/**
 * @type {FunctionRunResult}
 */
const NO_CHANGES = {
  operations: [],
};

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function run(input) {

  if (input?.cart?.province_vat_exempt?.value !== "true") return NO_CHANGES;
  
  let operations = [];

  input.cart.lines.map((line) => {
    const taxDivider = 1.1;

    operations.push({
      update: {
        cartLineId: line.id,
        price: {
          adjustment: {
            fixedPricePerUnit: {
              amount: (line.cost.totalAmount.amount / line.quantity) / taxDivider,
            },
          },
        },
      },
    });
  });

  return operations ? { operations } : NO_CHANGES;
};