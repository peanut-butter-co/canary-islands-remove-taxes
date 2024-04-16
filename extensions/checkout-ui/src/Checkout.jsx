import React, { useState, useEffect } from "react";
import {
  Icon,
  Pressable,
  Tooltip,
  TextField,
  BlockStack,
  useTranslate,
  reactExtension,
  useShippingAddress,
  useApplyAttributeChange,
  useBuyerJourneyIntercept,
  useApplyMetafieldsChange,
  useMetafield,
} from "@shopify/ui-extensions-react/checkout";

export default reactExtension("purchase.checkout.delivery-address.render-before", () => (
  <Extension />
));

function Extension() {
  const metafieldNamespace = "customer";
  const metafieldKey = "card_id";

  const documentMetafieldField = useMetafield({
    namespace: metafieldNamespace,
    key: metafieldKey
  });

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

  const { provinceCode, countryCode } = useShippingAddress();
  const translate = useTranslate();
  const [cardId, setCardId] = useState(documentMetafieldField?.value ? documentMetafieldField.value : '');
  const [error, setError] = useState('');

  const applyMetafieldsChange = useApplyMetafieldsChange();
  const setAttribute = useApplyAttributeChange();

  const addressTaxExempt = (countryCode, provinceCode) => {

    if (countrySettings[countryCode] && (
      countrySettings[countryCode].taxExemption == "yes" ||
      countrySettings[countryCode].taxExemption == "per_province" && countrySettings[countryCode].taxExemptionProvinces.includes(provinceCode))) {
      return true;
    }

    return false;
  }

  const documentRequired = (countryCode, provinceCode) => {

    if (countrySettings[countryCode] && (
      countrySettings[countryCode].documentRequired == "yes" ||
      countrySettings[countryCode].documentRequired == "per_province" && countrySettings[countryCode].documentRequiredProvinces.includes(provinceCode))) {
      return true;
    }
  }
  const clearValidationErrors = (value) => {
    if (value == '') {
      setError(translate('error'));
    } else {
      setError('');
    }
  }
  useBuyerJourneyIntercept(({ canBlockProgress }) => {
    const shouldBlockProgress = canBlockProgress && cardId === '' && documentRequired(countryCode, provinceCode);

    if (shouldBlockProgress) {
      return {
        behavior: "block",
        reason: translate('error'),
        perform: (result) => {
          if (result.behavior === "block") {
            setError(translate('error'));
          }
        },
      };
    }
    return {
      behavior: "allow",
      perform: () => {
        setError("");
      },
    };
  });

  useEffect(() => {
    const handleLogData = async () => {

      setAttribute({
        type: "updateAttribute",
        key: `province_vat_exempt`,
        value: addressTaxExempt(countryCode, provinceCode) ? "true" : "false",
      });

      if (documentRequired(countryCode, provinceCode) && cardId !== '') {
        applyMetafieldsChange({
          type: "updateMetafield",
          namespace: metafieldNamespace,
          key: metafieldKey,
          valueType: "string",
          value: cardId,
        });
      } else {
        setCardId('');
        applyMetafieldsChange({
          type: "removeMetafield",
          namespace: metafieldNamespace,
          key: metafieldKey,
        });
      }
    };

    handleLogData();
  }, [provinceCode, countryCode, cardId]);

  return (
    (documentRequired(countryCode, provinceCode)) && (
      <BlockStack>
        <TextField
          label={translate('label')}
          onChange={(value) => setCardId(value)}
          onInput={clearValidationErrors}
          value={cardId}
          error={error}
          accessory={
            <Pressable
              overlay={
                <Tooltip>
                  {translate('accessory')}
                </Tooltip>
              }
            >
              <Icon source="info" appearance="subdued" />
            </Pressable>
          }
        />
      </BlockStack>
    )
  );
}
