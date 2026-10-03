import { filterConversations } from './conversation';
import { toggleReaction, waveformBars } from './message';

const conversations = [
  { accent: '#fff', id: 'friend', initials: 'CA', kind: 'friend' as const, lastMessage: 'Nos vemos', name: 'Camila', unread: 2, time: '10:00' },
  { accent: '#000', id: 'group', initials: 'VP', kind: 'group' as const, lastMessage: 'Reunión', name: 'Vecinos', time: 'Ayer' },
];

describe('chat domain', () => {
  it('filters inbox by category and normalized query', () => {
    expect(filterConversations(conversations, 'unread', '')).toEqual([conversations[0]]);
    expect(filterConversations(conversations, 'all', 'reunión')).toEqual([conversations[1]]);
    expect(filterConversations(conversations, 'friends', 'vecinos')).toEqual([]);
  });

  it('adds and removes the current user reaction', () => {
    const message = { id: 'message', mine: false, text: 'Hola', time: '10:00' };
    const reacted = toggleReaction(message, '👍');
    expect(reacted.reactions).toEqual([{ count: 1, emoji: '👍', mine: true }]);
    expect(toggleReaction(reacted, '👍').reactions).toEqual([]);
  });

  it('resamples a waveform to a stable visual bar count', () => {
    expect(waveformBars([0.1, 0.5, 0.2], 5)).toHaveLength(5);
    expect(waveformBars([], 4)).toEqual([0.12, 0.12, 0.12, 0.12]);
  });
});
