import { Suspense } from "react";
import { PairDevicePage } from "@/components/pairing/PairDevicePage";

export default function PairPage() {
  return (
    <Suspense fallback={null}>
      <PairDevicePage />
    </Suspense>
  );
}
