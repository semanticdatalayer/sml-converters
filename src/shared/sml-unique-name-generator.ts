import { SmlConverterQuery } from "./sml-converter-queries";

const UniqueNamesGenerators: Record<string, NewNameGenerator> = {
  IndexSuffixed: (proposed_name: string, index: number) =>
    `${proposed_name} (${index})`,
};

export type UniqueNameGeneratorExistsFunc = (
  currentProposal: string,
) => boolean;
export type NewNameGenerator = (proposed_name: string, index: number) => string;

export class SmlUniqueNameGenerator {
  private constructor(private readonly query: SmlConverterQuery) {}

  static fromQuery(query: SmlConverterQuery) {
    return new SmlUniqueNameGenerator(query);
  }

  generateNewUniqueName(
    proposedName: string,
    doesItExistsFunc: UniqueNameGeneratorExistsFunc,
    newNameGenerator: NewNameGenerator,
    maxIterations = 10,
  ): string {
    if (!doesItExistsFunc(proposedName)) {
      return proposedName;
    }

    const proposedNames = [proposedName];

    for (let i = 1; i < maxIterations; i++) {
      const newName = newNameGenerator(proposedName, i);
      proposedNames.push(newName);
      if (!doesItExistsFunc(newName)) {
        return newName;
      }
    }

    throw new Error(
      `Could not generate new unique_name for ${proposedName}. All proposed names are reserved already: ${proposedNames.join(
        ",",
      )}`,
    );
  }

  protected getNewUniqueNameForAttribute(
    proposedName: string,
    strategy = UniqueNamesGenerators.IndexSuffixed,
  ): string {
    const allAttributes = [
      ...this.query.getAllDimensionsAttributesUniqueNames(),
      ...this.query.getAllMetricsUniqueName(),
    ];
    const checkFunc: UniqueNameGeneratorExistsFunc = (currentProposal) =>
      allAttributes.includes(currentProposal);

    return this.generateNewUniqueName(proposedName, checkFunc, strategy);
  }

  getNewUniqueNameForMetric(
    proposedName: string,
    strategy = UniqueNamesGenerators.IndexSuffixed,
  ) {
    return this.getNewUniqueNameForAttribute(proposedName, strategy);
  }

  getNewUniqueNameForLevel(
    proposedName: string,
    strategy = UniqueNamesGenerators.IndexSuffixed,
  ) {
    return this.getNewUniqueNameForAttribute(proposedName, strategy);
  }

  getNewUniqueNameForSecondaryAttribute(
    proposedName: string,
    strategy = UniqueNamesGenerators.IndexSuffixed,
  ) {
    return this.getNewUniqueNameForAttribute(proposedName, strategy);
  }

  getNewUniqueNameForMetricalAttribute(
    proposedName: string,
    strategy = UniqueNamesGenerators.IndexSuffixed,
  ) {
    return this.getNewUniqueNameForAttribute(proposedName, strategy);
  }

  getNewUniqueNameForLevelAlias(
    proposedName: string,
    strategy = UniqueNamesGenerators.IndexSuffixed,
  ) {
    return this.getNewUniqueNameForAttribute(proposedName, strategy);
  }
}
