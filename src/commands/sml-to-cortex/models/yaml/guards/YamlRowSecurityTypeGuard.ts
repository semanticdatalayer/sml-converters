import { SMLRowSecurity } from "sml-sdk";
import TypeGuardUtil from "./type-guard-util";

export default class YamlRowSecurityTypeGuard {
  static hasDatasetProp(rowSecurity: SMLRowSecurity): boolean {
    return TypeGuardUtil.hasProps(rowSecurity, "dataset");
  }
}
