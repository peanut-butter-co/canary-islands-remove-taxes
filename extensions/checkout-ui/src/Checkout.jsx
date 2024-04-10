import React, { useState, useEffect, useRef, forwardRef } from "react";
import {
  useApi,
  reactExtension,
  Modal,
  Link,
  Button,
  TextBlock,
  useShippingAddress,
  useApplyAttributeChange,
} from "@shopify/ui-extensions-react/checkout";

export default reactExtension("purchase.checkout.block.render", () => (
  <Extension />
));

function Extension() {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const { provinceCode, countryCode } = useShippingAddress();

  const setAttribute = useApplyAttributeChange();

  useEffect(() => {
    const handleLogData = async () => {
      if (
        (provinceCode === "TF" || provinceCode === "GC") &&
        countryCode === "ES"
      ) {
        console.log(provinceCode);
        console.log(countryCode);
        setIsModalOpen(true);
        const myAtt = await setAttribute({
          type: "updateAttribute",
          key: `province_vat_exempt`,
          value: "true",
        });
        console.log(myAtt);
      } else {
        setIsModalOpen(false);
      }
    };

    handleLogData();
  }, [provinceCode, countryCode]);

  return <>{isModalOpen && <LinkWithModal />}</>;
}

const LinkWithModal = forwardRef((props, ref) => {
  const { ui } = useApi();
  const linkRef = useRef(null);

  useEffect(() => {
    console.log(linkRef);
    if (linkRef.current) {
      console.log(linkRef.current);
      linkRef.current.click();
    }
  }, [linkRef]);

  return (
    <Link
      ref={ref}
      overlay={
        <Modal id="my-modal" padding title="Actualizacion de precios">
          <TextBlock>
            Los precios de estos articulos cambiaron y se actualizacion en el
            carrito.
          </TextBlock>
          <TextBlock>Products Loop Here</TextBlock>
          <Button onPress={() => ui.overlay.close("my-modal")}>Close</Button>
        </Modal>
      }
    >
      Return policy
    </Link>
  );
});
