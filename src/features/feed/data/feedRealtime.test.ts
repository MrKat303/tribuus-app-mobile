import { supabase } from '@/shared/infrastructure/supabase/client';
import {
  postIdFromRealtimePayload,
  subscribeToCommunityFeedChanges,
  subscribeToPostComments,
} from './feedRealtime';

jest.mock('@/shared/infrastructure/supabase/client', () => ({
  supabase: {
    channel: jest.fn(),
    removeChannel: jest.fn(),
  },
}));

const mockOn = jest.fn();
const mockSubscribe = jest.fn();
const mockRealtimeChannel = { on: mockOn, subscribe: mockSubscribe };
const mockChannel = jest.mocked(supabase.channel);
const mockRemoveChannel = jest.mocked(supabase.removeChannel);

beforeEach(() => {
  jest.clearAllMocks();
  mockOn.mockReturnValue(mockRealtimeChannel);
  mockSubscribe.mockReturnValue(mockRealtimeChannel);
  mockChannel.mockReturnValue(mockRealtimeChannel as unknown as ReturnType<typeof supabase.channel>);
});

describe('feed realtime subscriptions', () => {
  it('extracts a post id from parent and child table payloads', () => {
    expect(postIdFromRealtimePayload({ new: { id: 12 }, old: {} })).toBe('12');
    expect(postIdFromRealtimePayload({ new: { post_id: '23' }, old: {} })).toBe('23');
    expect(postIdFromRealtimePayload({ new: {}, old: { post_id: 34 } })).toBe('34');
    expect(postIdFromRealtimePayload({ new: { post_id: 'invalid' }, old: {} })).toBeNull();
  });

  it('subscribes to posts and structural rows for visible posts only', () => {
    const onChange = jest.fn();
    const unsubscribe = subscribeToCommunityFeedChanges(
      'community-1',
      ['10', '20', 'pending-post'],
      onChange,
    );

    expect(mockChannel).toHaveBeenCalledWith(expect.stringMatching(/^feed:community-1:\d+$/));
    expect(mockSubscribe).toHaveBeenCalledTimes(1);

    const registrations = mockOn.mock.calls.map(([, config]) => config);
    expect(registrations).toEqual(expect.arrayContaining([
      expect.objectContaining({ filter: 'community_id=eq.community-1', table: 'posts' }),
      expect.objectContaining({ event: 'INSERT', filter: 'post_id=in.(10,20)', table: 'post_images' }),
      expect.objectContaining({ event: 'UPDATE', filter: 'post_id=in.(10,20)', table: 'post_polls' }),
      expect.objectContaining({ event: 'UPDATE', filter: 'post_id=in.(10,20)', table: 'poll_options' }),
    ]));

    const postsRegistration = mockOn.mock.calls.find(([, config]) => config.table === 'posts');
    postsRegistration?.[2]({ eventType: 'UPDATE', new: { id: 10 }, old: {} });
    expect(onChange).toHaveBeenCalledWith({ postId: '10', scope: 'post' });

    unsubscribe();
    expect(mockRemoveChannel).toHaveBeenCalledWith(mockRealtimeChannel);
  });

  it('scopes comment subscriptions to the open post', () => {
    const onChange = jest.fn();
    const unsubscribe = subscribeToPostComments('42', onChange);

    expect(mockChannel).toHaveBeenCalledWith('post-comments:42');
    expect(mockOn).toHaveBeenCalledTimes(2);
    expect(mockOn.mock.calls.map(([, config]) => config)).toEqual([
      { event: 'INSERT', filter: 'post_id=eq.42', schema: 'public', table: 'post_comments' },
      { event: 'UPDATE', filter: 'post_id=eq.42', schema: 'public', table: 'post_comments' },
    ]);

    unsubscribe();
    expect(mockRemoveChannel).toHaveBeenCalledWith(mockRealtimeChannel);
  });

  it('does not open a channel for an invalid post id', () => {
    const unsubscribe = subscribeToPostComments('pending-post', jest.fn());
    unsubscribe();
    expect(mockChannel).not.toHaveBeenCalled();
  });
});
