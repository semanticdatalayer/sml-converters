import { IYamlRowSecurity } from "../IYamlRowSecurity";
import TypeGuardUtil from "./type-guard-util";

export default class YamlRowSecurityTypeGuard {
  static hasDatasetProp(rowSecurity: IYamlRowSecurity): boolean {
    return TypeGuardUtil.hasProps(rowSecurity, "dataset");
  }
}
