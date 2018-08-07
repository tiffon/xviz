import {default as GLBContainer} from '../glb-loader/glb-container';
import {GLBBufferPacker} from '../glb-loader';
import {packJsonArrays} from '../glb-loader/pack-json-arrays';

const MAGIC_XVIZ = 0x5856495a; // XVIZ in Big-Endian ASCII

// const tokenize = index => `$$$${index}`;

export function packXVIZ(xvizJson, opts) {
  const bufferPacker = new GLBBufferPacker();
  const packedXviz = {};

  const xvizTopKeys = Object.keys(xvizJson);
  for (const key of xvizTopKeys) {
    switch (key) {
      case 'state_updates':
        packedXviz[key] = packXVIZStateUpdates(xvizJson[key], bufferPacker, opts);
        break;
      default:
        packedXviz[key] = xvizJson[key];
        break;
    }
  }

  const {json, arrayBuffer} = bufferPacker.packBuffers();
  packedXviz.buffers = json;

  return GLBContainer.createGlbBuffer(packedXviz, arrayBuffer, MAGIC_XVIZ);
}

function packXVIZStateUpdates(stateUpdates, bufferPacker, opts) {
  const packedUpdates = [];

  stateUpdates.forEach(xvizUpdate => {
    const newUpdate = {};
    for (const key in xvizUpdate) {
      switch (key) {
        case 'primitives':
          newUpdate[key] = packXVIZPrimitives(xvizUpdate[key], bufferPacker, opts);
          break;
        case 'futures':
        case 'timestamp':
        case 'variables':
        default:
          newUpdate[key] = xvizUpdate[key];
      }
    }

    packedUpdates.push(newUpdate);
  });

  return packedUpdates;
}

function packXVIZPrimitives(primitives, bufferPacker, opts) {
  if (!primitives) {
    return primitives;
  }

  const newPrimitives = {};
  const {streams = []} = opts;

  for (const key in primitives) {
    if (streams.includes(key)) {
      const newPrimitive = [];
      for (const element of primitives[key]) {
        const elem = {...element};
        /* eslint-disable */
        if (elem.vertices.length > 3) {
          elem.vertices = packJsonArrays(elem.vertices, bufferPacker);
        }
        newPrimitive.push(elem);
      }
      newPrimitives[key] = newPrimitive;
    } else {
      newPrimitives[key] = primitives[key];
    }
  }

  return newPrimitives;
}