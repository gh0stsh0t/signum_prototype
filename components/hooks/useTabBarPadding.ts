import { useSafeAreaInsets } from "react-native-safe-area-context";

export const TAB_BAR_HEIGHT = 65;
export const TAB_BAR_BOTTOM_MARGIN = 25;

export function useTabBarPadding() {
  const insets = useSafeAreaInsets();

  // Total padding = Tab Height + Bottom Offset + Safe Area (for iPhones) + 20px breathing room
  const totalPadding =
    TAB_BAR_HEIGHT + TAB_BAR_BOTTOM_MARGIN + insets.bottom + 20;

  return totalPadding;
}
