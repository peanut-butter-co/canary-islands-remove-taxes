import React, { useEffect } from "react";
import {
  reactExtension,
  useShippingAddress,
  useApplyAttributeChange,
} from "@shopify/ui-extensions-react/checkout";

export default reactExtension("purchase.checkout.block.render", () => (
  <Extension />
));

function Extension() {
  const { provinceCode, countryCode } = useShippingAddress();

  const setAttribute = useApplyAttributeChange();

  const taxExemptProvinces = ["TF", "GC"];

  useEffect(() => {
    const handleLogData = async () => {
      if (countryCode === "ES" && taxExemptProvinces.includes(provinceCode)) {
        setAttribute({
          type: "updateAttribute",
          key: `province_vat_exempt`,
          value: "true",
        });
      } else {
        setAttribute({
          type: "updateAttribute",
          key: `province_vat_exempt`,
          value: "false",
        });
      }
    };

    handleLogData();
  }, [provinceCode, countryCode]);

  return <></>;
}
