// @ts-check

import { BuyerJourneyStep } from "../generated/api";

/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 */

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function run(input) {
  // If the buyer is not in the checkout, or hasn't provided a delivery address, we don't need to do anything
  if (input.buyerJourney.step !== BuyerJourneyStep.CheckoutInteraction || !input.cart.deliveryGroups || !input.cart.deliveryGroups[0].deliveryAddress) {
    return {
      errors: []
    }
  }

  // Setting up the language object
  const langs = {
    en: {
      "label": "National Identification Document / Id Card",
      "error": "National Identification Document / Id Card is Required",
      "accessory": "The ID card is used to identify the user.",
      "generic_tax_exempt_error": "Something went wrong, please try again."
    },
    es: {
      "label": "Documento nacional de identidad",
      "error": "Documento nacional de identidad (requerido)",
      "accessory": "La tarjeta de identificación se utiliza para identificar al usuario.",
      "generic_tax_exempt_error": "Something went wrong, please try again."
    },
    fr: {
      "label": "Carte nationale d'identité / Carte d'identité",
      "error": "La carte nationale d'identité / la carte d'identité est requise",
      "accessory": "The ID card is used to identify the user.",
      "generic_tax_exempt_error": "Something went wrong, please try again."
    },
  }

  // I am assuming `es` as the default language
  const lang = Object.keys(langs).includes(input.localization.language.isoCode.toLowerCase())
    ? input.localization.language.isoCode.toLowerCase()
    : "es";


  // Setting up the country settings (this is copied from the UI extension code)
  const countrySettings = {
    "ES": { // Spain
      taxExemption: "per_province",
      taxExemptionProvinces: ["TF", "GC", "CE", "ML"],  // Santa Cruz de Tenerife, Las Palmas, Ceuta y Melilla
      documentRequired: "per_province",
      documentRequiredProvinces: ["TF", "GC", "CE", "ML"] // Santa Cruz de Tenerife, Las Palmas, Ceuta y Melilla
    },
    "AD": { // Andorra
      taxExemption: "yes",
      taxExemptionProvinces: [],
      documentRequired: "yes",
      documentRequiredProvinces: []
    },
    "CH": { // Switzerland
      taxExemption: "no",
      taxExemptionProvinces: [],
      documentRequired: "yes",
      documentRequiredProvinces: []
    },
    "GB": { // United kingdom
      taxExemption: "no",
      taxExemptionProvinces: [],
      documentRequired: "yes",
      documentRequiredProvinces: []
    }
  }

  const documentRequired = (countryCode, provinceCode) => {
    if (countrySettings[countryCode] && (
      countrySettings[countryCode].documentRequired == "yes" ||
      countrySettings[countryCode].documentRequired == "per_province" && countrySettings[countryCode].documentRequiredProvinces.includes(provinceCode))) {
      return true;
    } else {
      return false;
    }
  }

  const addressTaxExempt = (countryCode, provinceCode) => {
    if (countrySettings[countryCode] && (
      countrySettings[countryCode].taxExemption == "yes" ||
      countrySettings[countryCode].taxExemption == "per_province" && countrySettings[countryCode].taxExemptionProvinces.includes(provinceCode))) {
      return true;
    } else {
      return false;
    }
  }

  // Now we can check if the document is required and if hasn't been provided

  const { countryCode, provinceCode } = input.cart.deliveryGroups[0].deliveryAddress;
  const card_id = input.cart.buyerIdentity?.customer?.card_id?.value;

  if (documentRequired(countryCode, provinceCode) && !card_id) {
    return {
      errors: [{
        localizedMessage: langs[lang].error,
        target: "cart",
      }]
    }
  }

  // And we can also check if the user is tax exempt

  if (input.cart.province_vat_exempt?.value === "true") {
    if (addressTaxExempt(countryCode, provinceCode)) {
      return {
        errors: []
      }
    } else {
      return {
        errors: [{
          localizedMessage: langs[lang].generic_tax_exempt_error,
          target: "cart",
        }]
      }
    }
  } else {
    if (addressTaxExempt(countryCode, provinceCode)) {
      return {
        errors: [{
          localizedMessage: langs[lang].generic_tax_exempt_error,
          target: "cart",
        }]
      }
    } else {
      return {
        errors: []
      }
    }
  }
};

