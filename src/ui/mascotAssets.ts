/**
 * UI — Static mascot illustrations (Metro bundles these for native release).
 */

import { ImageSourcePropType } from 'react-native';
import { MascotPose } from '../core/mascot';

export const MASCOT_POSE_IMAGES: Record<MascotPose, ImageSourcePropType> = {
  hi: require('../../assets/abby/Abby_hi.png'),
  worried: require('../../assets/abby/Abby_worried.png'),
  nice: require('../../assets/abby/Abby_nice.png'),
  happy: require('../../assets/abby/Abby_happy.png'),
};
