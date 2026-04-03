type PetSound = "meow" | "bark";

const TRANSLATIONS: Record<
  PetSound,
  { title: string; subtitle: string; energy: string; body: string }[]
> = {
  meow: [
    {
      title: "Royal breakfast complaint",
      subtitle: "Mood: dramatically underfed",
      energy: "87% diva energy",
      body: "Your cat would like to remind you that the bowl is 14 minutes behind schedule and this level of service is unacceptable.",
    },
    {
      title: "Window patrol update",
      subtitle: "Mood: hypervigilant",
      energy: "72% neighborhood surveillance",
      body: "A suspicious bird has landed outside and your cat expects immediate backup, preferably while being held like a tiny manager.",
    },
    {
      title: "Affection with conditions",
      subtitle: "Mood: selectively loving",
      energy: "64% cuddle request",
      body: "Please pet me lovingly for exactly six seconds, then stop before I file a formal complaint with my claws.",
    },
  ],
  bark: [
    {
      title: "Door security alert",
      subtitle: "Mood: heroic",
      energy: "91% protector mode",
      body: "Your dog has bravely informed the household that a leaf moved outside and only they had the courage to report it.",
    },
    {
      title: "Snack negotiation",
      subtitle: "Mood: hopeful and persuasive",
      energy: "78% treat ambition",
      body: "I performed several excellent barks and would now like compensation in the form of one biscuit per syllable.",
    },
    {
      title: "Walk demand escalation",
      subtitle: "Mood: impatient athlete",
      energy: "95% zoomies pending",
      body: "The current lack of outside time is deeply concerning and can only be resolved by a fast walk followed by celebratory sprinting.",
    },
  ],
};

export { PetSound, TRANSLATIONS };
