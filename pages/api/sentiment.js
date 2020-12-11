import * as tf from '@tensorflow/tfjs-node'

const urls = {
  model: 'https://storage.googleapis.com/tfjs-models/tfjs/sentiment_cnn_v1/model.json',
  metadata: 'https://storage.googleapis.com/tfjs-models/tfjs/sentiment_cnn_v1/metadata.json'
} 

const SentimentThreshold = {
  Positive: 0.66,
  Neutral: 0.33,
  Negative: 0
}
const PAD_INDEX = 0;
const OOV_INDEX = 2;

let model;
let metadata;

async function loadModel(url) {
  try {
    model = await tf.loadLayersModel(url);
    return model;
  } catch (err) {
    console.log(err);
  }
}

async function loadMetadata(url) {
  try {
    const metadataJson = await fetch(url);
    metadata = await metadataJson.json();
    return metadata;
  } catch (err) {
    console.log(err);
  }
}

function padSequences(sequences, maxLen, padding = 'pre', truncating = 'pre', value = PAD_INDEX) {
  return sequences.map(seq => {
  if (seq.length > maxLen) {
    if (truncating === 'pre') {
      seq.splice(0, seq.length - maxLen);
    } else {
      seq.splice(maxLen, seq.length - maxLen);
    }
  }

  if (seq.length < maxLen) {
    const pad = [];
    for (let i = 0; i < maxLen - seq.length; ++i) {
      pad.push(value);
    }
    if (padding === 'pre') {
      seq = pad.concat(seq);
    } else {
      seq = seq.concat(pad);
    }
  }

  return seq;
  });
}

export async function setupSentimentModel(){
  if(typeof model === 'undefined'){
    model = await loadModel(urls.model);
  }
  if(typeof metadata === 'undefined'){
    metadata = await loadMetadata(urls.metadata);
  }
  return;
}

export function getSentimentScore(text) {
  const spaceChars = /[^a-z0-9'‘’´åáàäãâæéèëêíîïöóôøúüû£çñ]+/g 
  const inputText = text.toLowerCase().replace(spaceChars, ' ').trim().split(' ');
  // Convert the words to a sequence of word indices.
  const sequence = inputText.map(word => {
    let wordIndex = metadata.word_index[word] + metadata.index_from;
    if (wordIndex > metadata.vocabulary_size) {
      wordIndex = OOV_INDEX;
    }
    if (isNaN(wordIndex)) {
      wordIndex = OOV_INDEX;
    }
    return wordIndex;
  });
  // Perform truncation and padding.
  const paddedSequence = padSequences([sequence], metadata.max_len);
  const input = tf.tensor2d(paddedSequence, [1, metadata.max_len]);

  const predictOut = model.predict(input);
  const score = predictOut.dataSync()[0];
  predictOut.dispose();

  return score;
}
