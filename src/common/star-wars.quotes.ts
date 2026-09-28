const QUOTES = [
  'May the Force be with you.',
  'Do. Or do not. There is no try.',
  'The Force will be with you, always.',
  'Never tell me the odds.',
  "I find your lack of faith disturbing.",
  "It's a trap!",
  'Help me, Obi-Wan Kenobi. You are my only hope.',
  'In my experience there is no such thing as luck.',
  'Your focus determines your reality.',
  'Pass on what you have learned.',
];

export function randomQuote(): string {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}
