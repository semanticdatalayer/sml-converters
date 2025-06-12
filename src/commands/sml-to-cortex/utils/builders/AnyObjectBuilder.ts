import { ICloneOptions, IIndexer } from "../clone";
import { AbstractObjectBuilder } from "./AbstractObjectBuilder";

export class AnyObjectBuilder<IData extends IIndexer> extends AbstractObjectBuilder<IData, AnyObjectBuilder<IData>> {
  public static from<IData extends IIndexer>(
    data: IData,
    cloneOptions: Partial<ICloneOptions> = {}
  ): AnyObjectBuilder<IData> {
    return new AnyObjectBuilder<IData>(data, cloneOptions);
  }

  public static fromPartial<IData extends IIndexer>(
    data: Partial<IData>,
    cloneOptions: Partial<ICloneOptions> = {}
  ): AnyObjectBuilder<IData> {
    return new AnyObjectBuilder<IData>(data as IData, cloneOptions);
  }
}
