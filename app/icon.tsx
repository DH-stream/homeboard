import { ImageResponse } from "next/og";

export const contentType = "image/png";

export default function Icon({ size = 512 }: { size?: number }) {
  const iconSize = Number(size) || 512;
  const panelInset = Math.round(iconSize * 0.12);
  const houseWidth = Math.round(iconSize * 0.4);
  const houseHeight = Math.round(iconSize * 0.24);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fbf7ef",
        }}
      >
        <div
          style={{
            width: iconSize - panelInset * 2,
            height: iconSize - panelInset * 2,
            borderRadius: Math.round(iconSize * 0.22),
            background: "#f59e0b",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: `${Math.round(houseWidth / 2 + iconSize * 0.03)}px solid transparent`,
              borderRight: `${Math.round(houseWidth / 2 + iconSize * 0.03)}px solid transparent`,
              borderBottom: `${Math.round(iconSize * 0.22)}px solid #fbf7ef`,
              position: "absolute",
              top: Math.round(iconSize * 0.17),
            }}
          />
          <div
            style={{
              width: houseWidth,
              height: houseHeight,
              borderRadius: Math.round(iconSize * 0.04),
              background: "#fbf7ef",
              marginTop: Math.round(iconSize * 0.13),
              display: "flex",
              justifyContent: "center",
              alignItems: "flex-end",
              paddingBottom: Math.round(iconSize * 0.04),
            }}
          >
            <div
              style={{
                width: Math.round(houseWidth * 0.2),
                height: Math.round(houseHeight * 0.56),
                borderRadius: Math.round(iconSize * 0.02),
                background: "#f59e0b",
              }}
            />
          </div>
        </div>
      </div>
    ),
    { width: iconSize, height: iconSize },
  );
}
