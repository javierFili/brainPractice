import { sample, type RandomGenerator } from '@/domain/random';

export type ObjectCategory =
  'fruit' | 'animal' | 'vehicle' | 'tool' | 'clothing' | 'nature' | 'food';

/** Everyday objects with an emoji face and a spoken name. Names are unique. */
export interface EverydayObject {
  readonly id: string;
  readonly name: string;
  readonly emoji: string;
  readonly category: ObjectCategory;
}

const o = (emoji: string, name: string, category: ObjectCategory): EverydayObject => ({
  id: name.replaceAll(' ', '-'),
  name,
  emoji,
  category,
});

export const OBJECTS: readonly EverydayObject[] = [
  o('🍎', 'apple', 'fruit'),
  o('🍌', 'banana', 'fruit'),
  o('🍇', 'grapes', 'fruit'),
  o('🍓', 'strawberry', 'fruit'),
  o('🍐', 'pear', 'fruit'),
  o('🍒', 'cherries', 'fruit'),
  o('🍋', 'lemon', 'fruit'),
  o('🍉', 'watermelon', 'fruit'),
  o('🐶', 'dog', 'animal'),
  o('🐱', 'cat', 'animal'),
  o('🐟', 'fish', 'animal'),
  o('🐦', 'bird', 'animal'),
  o('🐢', 'turtle', 'animal'),
  o('🐘', 'elephant', 'animal'),
  o('🦒', 'giraffe', 'animal'),
  o('🐝', 'bee', 'animal'),
  o('🚗', 'car', 'vehicle'),
  o('🚲', 'bicycle', 'vehicle'),
  o('🚌', 'bus', 'vehicle'),
  o('✈️', 'airplane', 'vehicle'),
  o('🚂', 'train', 'vehicle'),
  o('⛵', 'sailboat', 'vehicle'),
  o('🚀', 'rocket', 'vehicle'),
  o('🛵', 'scooter', 'vehicle'),
  o('🔨', 'hammer', 'tool'),
  o('🔑', 'key', 'tool'),
  o('✂️', 'scissors', 'tool'),
  o('🔧', 'wrench', 'tool'),
  o('🖊️', 'pen', 'tool'),
  o('📎', 'paperclip', 'tool'),
  o('🔦', 'flashlight', 'tool'),
  o('🧲', 'magnet', 'tool'),
  o('👕', 't-shirt', 'clothing'),
  o('👖', 'jeans', 'clothing'),
  o('🧦', 'socks', 'clothing'),
  o('🧢', 'cap', 'clothing'),
  o('👟', 'sneaker', 'clothing'),
  o('🧣', 'scarf', 'clothing'),
  o('🧤', 'gloves', 'clothing'),
  o('👓', 'glasses', 'clothing'),
  o('🌳', 'tree', 'nature'),
  o('🌻', 'sunflower', 'nature'),
  o('🌙', 'moon', 'nature'),
  o('⭐', 'star', 'nature'),
  o('🌈', 'rainbow', 'nature'),
  o('🍄', 'mushroom', 'nature'),
  o('🌵', 'cactus', 'nature'),
  o('❄️', 'snowflake', 'nature'),
  o('🍞', 'bread', 'food'),
  o('🧀', 'cheese', 'food'),
  o('🍕', 'pizza', 'food'),
  o('🥕', 'carrot', 'food'),
  o('🥚', 'egg', 'food'),
  o('🍪', 'cookie', 'food'),
  o('🥛', 'milk', 'food'),
  o('🍯', 'honey', 'food'),
];

export const OBJECT_CATEGORIES: readonly ObjectCategory[] = [
  'fruit',
  'animal',
  'vehicle',
  'tool',
  'clothing',
  'nature',
  'food',
];

export const objectsOf = (category: ObjectCategory) =>
  OBJECTS.filter((item) => item.category === category);

export const sampleObjects = (random: RandomGenerator, count: number) =>
  sample(random, OBJECTS, count);
