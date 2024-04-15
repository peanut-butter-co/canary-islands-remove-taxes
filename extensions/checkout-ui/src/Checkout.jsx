import React, { useState, useEffect } from "react";
import {
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

export default reactExtension("purchase.checkout.block.render", () => (
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
    "ES": {
      taxExemption: "per_province",
      taxExemptionProvinces: ["TF", "GC"],
      documentRequired: "per_province",
      documentRequiredProvinces: ["TF", "GC"]
    },
    "AD": {
      taxExemption: "yes",
      taxExemptionProvinces: [],
      documentRequired: "yes",
      documentRequiredProvinces: []
    },
    "CH": {
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

  useBuyerJourneyIntercept(({ canBlockProgress }) => {
    const shouldBlockProgress = canBlockProgress && cardId === '' && documentRequired(countryCode, provinceCode);

    if (shouldBlockProgress) {
      setError(translate('error'));
      return {
        behavior: "block",
        reason: translate('error'),
      };
    }
    setError("");
    return {
      behavior: "allow",
    };
  });

  useEffect(() => {
    const handleLogData = async () => {

      setAttribute({
        type: "updateAttribute",
        key: `province_vat_exempt`,
        value:  addressTaxExempt(countryCode, provinceCode) ? "true" : "false",
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
          value={cardId}
          error={error}
        />
      </BlockStack>
    )
  );
}
