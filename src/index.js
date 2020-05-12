import {DeathsConfirmedGraph} from './graph/DeathsConfirmed';
import {After100Cases} from './graph/After100Cases';

import './style.css';

(async function() {
  await DeathsConfirmedGraph();
  await After100Cases();
})();



