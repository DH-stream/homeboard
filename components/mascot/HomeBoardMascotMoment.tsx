import styles from "./HomeBoardMascotMoment.module.css";
import softPortalStyles from "./HomeBoardMascotSoftPortal.module.css";

export type HomeBoardMascotMomentType = "thumbsUp" | "proudClap";

type HomeBoardMascotMomentProps = {
  className?: string;
  moment?: HomeBoardMascotMomentType;
  label?: string;
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function HomeBoardMascotMoment({
  className,
  moment = "thumbsUp",
  label,
}: HomeBoardMascotMomentProps) {
  const isClap = moment === "proudClap";

  return (
    <div
      aria-hidden={label ? undefined : true}
      aria-label={label}
      className={cx(styles.moment, styles[moment], className)}
      role={label ? "img" : undefined}
    >
      <div className={cx(styles.portal, softPortalStyles.portal)}>
        <div className={cx(styles.portalRing, softPortalStyles.portalRing)} />
        <div className={cx(styles.portalCore, softPortalStyles.portalCore)} />
        <div className={styles.portalStarOne} />
        <div className={styles.portalStarTwo} />
        <div className={styles.portalStarThree} />
      </div>

      <div className={styles.koalaWrap}>
        <div className={styles.shadow} />
        <div className={styles.koala}>
          <div className={cx(styles.ear, styles.earLeft)}>
            <span />
          </div>
          <div className={cx(styles.ear, styles.earRight)}>
            <span />
          </div>

          <div className={styles.head}>
            <div className={styles.cap}>
              <span className={styles.capMark} />
              <span className={styles.capBrim} />
            </div>
            <div className={styles.facePatch} />
            <span className={cx(styles.eye, styles.eyeLeft)} />
            <span className={cx(styles.eye, styles.eyeRight)} />
            <span className={styles.nose} />
            <span className={styles.mouth} />
            <span className={cx(styles.blush, styles.blushLeft)} />
            <span className={cx(styles.blush, styles.blushRight)} />
          </div>

          <div className={styles.body}>
            <div className={styles.jacket}>
              <span className={styles.shirt}>
                <span />
              </span>
              <span className={styles.heartPatch} />
            </div>
          </div>

          {isClap ? (
            <div className={styles.clapArms}>
              <span className={cx(styles.clapArm, styles.clapArmLeft)} />
              <span className={cx(styles.clapArm, styles.clapArmRight)} />
              <span className={cx(styles.clapPaw, styles.clapPawLeft)} />
              <span className={cx(styles.clapPaw, styles.clapPawRight)} />
              <span className={styles.clapSpark} />
            </div>
          ) : (
            <div className={styles.thumbsArms}>
              <span className={cx(styles.relaxedArm, styles.relaxedArmLeft)} />
              <span className={cx(styles.relaxedPaw, styles.relaxedPawLeft)} />
              <span className={styles.thumbsArm} />
              <span className={styles.thumbsPaw} />
              <span className={styles.thumb} />
            </div>
          )}

          <div className={styles.legs}>
            <span className={cx(styles.leg, styles.legLeft)} />
            <span className={cx(styles.leg, styles.legRight)} />
            <span className={cx(styles.shoe, styles.shoeLeft)} />
            <span className={cx(styles.shoe, styles.shoeRight)} />
          </div>
        </div>
      </div>
    </div>
  );
}
