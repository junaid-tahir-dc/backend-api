import { Role } from '@prisma/client';
import { SecondaryRole } from '../../../common/constants/role.constant';

export interface JwtPayload {
  sub: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  secondaryRole: SecondaryRole | null;

}
