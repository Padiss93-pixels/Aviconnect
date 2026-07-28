import Svg, { Ellipse, Circle, Path, Polygon, G, Line } from 'react-native-svg';

type Props = { size?: number };

export default function PlumesOrSVG({ size = 110 }: Props) {
  return (
    <Svg width={size} height={size * 0.95} viewBox="0 0 110 105">

      {/* Arc vert au-dessus des animaux */}
      <Path
        d="M8,82 A52,52 0 0,1 102,82"
        fill="none" stroke="#1A5C30" strokeWidth="3.5"
      />

      {/* ── CANARD (gauche, vert) ── */}
      <G>
        {/* corps */}
        <Ellipse cx="22" cy="80" rx="14" ry="9" fill="#2D6A4F" />
        {/* tête */}
        <Circle cx="11" cy="68" r="8" fill="#2D6A4F" />
        {/* bec */}
        <Polygon points="3,68 11,64 11,72" fill="#E8961A" />
        {/* aile claire */}
        <Ellipse cx="22" cy="79" rx="9" ry="5" fill="#3A7A5C" />
        {/* queue relevée */}
        <Path d="M35,74 Q44,62 40,56" fill="none" stroke="#2D6A4F" strokeWidth="4" strokeLinecap="round" />
      </G>

      {/* ── AUTRUCHE (2e depuis la gauche, gris-brun) ── */}
      <G>
        {/* corps */}
        <Ellipse cx="44" cy="84" rx="11" ry="13" fill="#7D7060" />
        {/* plumage ventre */}
        <Ellipse cx="44" cy="86" rx="7" ry="9" fill="#958878" />
        {/* cou long */}
        <Path d="M42,71 Q38,52 40,40" fill="none" stroke="#7D7060" strokeWidth="7" strokeLinecap="round" />
        {/* tête petite */}
        <Circle cx="40" cy="34" r="7" fill="#7D7060" />
        {/* bec */}
        <Polygon points="33,34 40,31 40,37" fill="#C4904A" />
        {/* œil */}
        <Circle cx="37" cy="32" r="1.5" fill="#1A1208" />
      </G>

      {/* ── POULE (centre, plus grande, dorée) ── */}
      <G>
        {/* corps */}
        <Ellipse cx="67" cy="80" rx="19" ry="16" fill="#E8A020" />
        {/* ventre plus clair */}
        <Ellipse cx="63" cy="83" rx="11" ry="10" fill="#F0B840" />
        {/* tête */}
        <Circle cx="52" cy="62" r="12" fill="#E8A020" />
        {/* crête */}
        <Path d="M48,50 Q51,43 54,50 Q57,43 60,50" fill="#C0392B" />
        {/* bec */}
        <Polygon points="40,63 52,59 52,67" fill="#E8961A" />
        {/* barbillon */}
        <Ellipse cx="43" cy="69" rx="4" ry="5" fill="#C0392B" />
        {/* œil */}
        <Circle cx="49" cy="60" r="2" fill="#1A1208" />
        {/* queue de plumes */}
        <Path d="M86,72 Q100,56 96,46" fill="none" stroke="#E8A020" strokeWidth="5" strokeLinecap="round" />
        <Path d="M86,78 Q102,66 100,56" fill="none" stroke="#C97B10" strokeWidth="4" strokeLinecap="round" />
        <Path d="M85,84 Q100,76 100,66" fill="none" stroke="#D4921A" strokeWidth="3" strokeLinecap="round" />
      </G>

      {/* ── OIE (droite, gris clair) ── */}
      <G>
        {/* corps */}
        <Ellipse cx="90" cy="82" rx="13" ry="11" fill="#B5AFA3" />
        {/* ventre plus clair */}
        <Ellipse cx="88" cy="84" rx="8" ry="7" fill="#CEC9BE" />
        {/* cou long vers la droite */}
        <Path d="M88,71 Q100,58 102,46" fill="none" stroke="#B5AFA3" strokeWidth="7" strokeLinecap="round" />
        {/* tête */}
        <Circle cx="103" cy="40" r="8" fill="#B5AFA3" />
        {/* bec */}
        <Polygon points="111,40 103,36 103,44" fill="#E8961A" />
        {/* œil */}
        <Circle cx="106" cy="38" r="1.5" fill="#1A1208" />
        {/* queue légère */}
        <Path d="M78,78 Q70,68 72,62" fill="none" stroke="#B5AFA3" strokeWidth="3" strokeLinecap="round" />
      </G>

      {/* Ligne fine sous les animaux */}
      <Line x1="10" y1="96" x2="100" y2="96" stroke="#1A5C3044" strokeWidth="1" />
    </Svg>
  );
}
