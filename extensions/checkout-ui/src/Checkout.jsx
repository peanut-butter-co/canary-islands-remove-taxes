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
  const taxExemptCountryCodes = ["ES", "US", "AD", "CH"];
  const taxExemptProvinces = ["TF", "GC"];

  const { provinceCode, countryCode } = useShippingAddress();
  const translate = useTranslate();
  const [cardId, setCardId] = useState('');
  const [error, setError] = useState('');
  const deliveryInstructions = useMetafield({ namespace: metafieldNamespace, key: metafieldKey });
  // console.log(deliveryInstructions);

  const applyMetafieldsChange = useApplyMetafieldsChange();
  const setAttribute = useApplyAttributeChange();

  useBuyerJourneyIntercept(({ canBlockProgress }) => {
    const shouldBlockProgress = canBlockProgress && cardId === '' &&
      ((taxExemptCountryCodes.includes(countryCode) && taxExemptProvinces.includes(provinceCode)) || countryCode === "US" || countryCode === "AD" || countryCode === "CH");

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
      const isTaxExemptCountry = taxExemptCountryCodes.includes(countryCode);
      const isTaxExemptProvince = taxExemptProvinces.includes(provinceCode);
      const shouldAddMetafield = (isTaxExemptCountry && isTaxExemptProvince) || countryCode === "US" || countryCode === "AD" || countryCode === "CH";

      setAttribute({
        type: "updateAttribute",
        key: `province_vat_exempt`,
        value: (isTaxExemptCountry && isTaxExemptProvince) ? "true" : "false",
      });

      if (shouldAddMetafield && cardId !== '') {
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
    (taxExemptCountryCodes.includes(countryCode) && taxExemptProvinces.includes(provinceCode)) && (
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
