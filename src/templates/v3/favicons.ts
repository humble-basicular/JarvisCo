import type { ImageMetadata } from 'astro';
import siltaIcon from '../../assets/client-favicons/silta-32.png';
import siltaTouch from '../../assets/client-favicons/silta-180.png';
import masIcon from '../../assets/client-favicons/mas-32.png';
import masTouch from '../../assets/client-favicons/mas-180.png';
import elektraIcon from '../../assets/client-favicons/meselektra-32.png';
import elektraTouch from '../../assets/client-favicons/meselektra-180.png';
import laikamIcon from '../../assets/client-favicons/laikam-32.png';
import laikamTouch from '../../assets/client-favicons/laikam-180.png';
import venslandIcon from '../../assets/client-favicons/vensland-32.png';
import venslandTouch from '../../assets/client-favicons/vensland-180.png';

// Approved browser icons are separate from header logos. Astro bundles these
// assets for both the shared preview site and standalone client-site builds.
const FAVICONS: Record<string, { icon: ImageMetadata; touch: ImageMetadata }> = {
  'Šilta srovė': { icon: siltaIcon, touch: siltaTouch },
  MasAukštalipiai: { icon: masIcon, touch: masTouch },
  MesElektra: { icon: elektraIcon, touch: elektraTouch },
  LaiKam: { icon: laikamIcon, touch: laikamTouch },
  VensLand: { icon: venslandIcon, touch: venslandTouch },
};

export function clientFavicon(business?: string) {
  return business && Object.hasOwn(FAVICONS, business) ? FAVICONS[business] : undefined;
}
