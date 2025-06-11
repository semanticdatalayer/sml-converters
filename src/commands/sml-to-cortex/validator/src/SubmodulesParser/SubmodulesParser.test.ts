import FileServiceBuilder from "../builders/FileServiceBuilder";
import { SubmodulesParser } from "./SubmodulesParser";

describe("SubmodulesParser.test", () => {
  it("should return submodules config", () => {
    const fileContent =
      '[submodule "aml-test-submodule"]\n\tpath = aml-test-submodule\n\turl = https://github.com/AtScaleInc/aml-test-submodule.git\n\tbranch = main\n[submodule "aml-test-submodule-2"]\n\tpath = aml-test-submodule-2\n\turl = https://github.com/AtScaleInc/aml-test-submodule-2.git\n\tbranch = master\n';

    const fileService = FileServiceBuilder.create();

    const parser = new SubmodulesParser(fileService.build());
    const submoduleInfo = parser.parseSubmodulesConfig(fileContent);

    const expected = [
      {
        name: "aml-test-submodule",
        url: "https://github.com/AtScaleInc/aml-test-submodule.git",
        branch: "main",
      },

      {
        name: "aml-test-submodule-2",
        url: "https://github.com/AtScaleInc/aml-test-submodule-2.git",
        branch: "master",
      },
    ];
    expect(submoduleInfo).toStrictEqual(expected);
  });

  it("suffix _submodule is added for submodules repo paths", () => {
    const parser = new SubmodulesParser(FileServiceBuilder.create().build());

    const path = parser.getSubmoduleRepoPath("rootRepo", "my-repo");
    expect(path).toStrictEqual(`/rootRepomy-repo_submodule`);
  });
});
