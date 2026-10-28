import type { ChoiceOption } from '@/domain/challenge';
import { SymbolFace } from './SymbolFace';

export const renderSymbol = (option: ChoiceOption) => <SymbolFace id={option.id} />;
