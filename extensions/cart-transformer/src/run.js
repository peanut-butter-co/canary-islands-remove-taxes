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
  console.log("erere rer r")
  console.log(input);
  const operations = input.cart.lines.reduce(
    /** @param {CartOperation[]} acc */
    (acc, cartLine) => {
      const customTax = 1.0125; // 1.25%
       const expandOperation = optionallyBuildExpandOperation(cartLine, customTax);

       if (expandOperation) {
         return [...acc, { expand: expandOperation }];
       }

       return acc;
    },
    []
  );

  return operations ? { operations } : NO_CHANGES;
};

/**
 * @param {RunInput['cart']['lines'][number]} cartLine
 */
function optionallyBuildExpandOperation({ id: cartLineId, merchandise, cost, quantity }, customTax) {
  if (merchandise.__typename === "ProductVariant") {
    console.log(merchandise.id);
    const expandedCartItems =[{
      merchandiseId: merchandise.id,
      quantity: 1,
      price: {
        adjustment: {
          fixedPricePerUnit: {
            amount: ((cost.totalAmount.amount  / quantity)* customTax).toFixed(2),
          },
        },
      },
    }];
    console.log(JSON.stringify(expandedCartItems));
    if (expandedCartItems.length > 0) {
      return { cartLineId, expandedCartItems };
    }
  }

  return null;
}