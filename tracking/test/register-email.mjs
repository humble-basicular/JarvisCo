import { register } from 'node:module';

// Install before importing the bundled Worker in Node's direct-handler tests.
register('./loader-email.mjs', import.meta.url);
