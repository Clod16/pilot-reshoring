import shim = require('fabric-shim');
import { CollaborativeSorting } from '.';

shim.start(new CollaborativeSorting('debug'));