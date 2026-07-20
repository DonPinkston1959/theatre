import { OrganizationType } from '../types';

const highSchoolPatterns = [
  /high school/i,
  /college prep academy/i,
  /paseo academy/i,
  /st\. teresa's academy/i,
  /the barstow school/i,
  /pembroke hill school/i
];

const communityPatterns = [
  /community/i,
  /civic/i,
  /barn players/i,
  /bell road barn/i,
  /theatre in the park/i,
  /theater in the park/i,
  /summit theatre group/i,
  /city theatre of independence/i
];

export const classifyOrganization = (name: string): OrganizationType => {
  if (highSchoolPatterns.some(pattern => pattern.test(name))) {
    return 'High School';
  }

  if (communityPatterns.some(pattern => pattern.test(name))) {
    return 'Community';
  }

  return 'Professional / Other';
};
