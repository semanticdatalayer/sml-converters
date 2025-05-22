"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@oclif/core");
class Hello extends core_1.Command {
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            const { args, flags } = yield this.parse(Hello);
            this.log(`hello ${args.person} from ${flags.from}! (./src/commands/hello/index.ts)`);
        });
    }
}
Hello.args = {
    person: core_1.Args.string({ description: 'Person to say hello to', required: true }),
};
Hello.description = 'Say hello';
Hello.examples = [
    `<%= config.bin %> <%= command.id %> friend --from oclif
hello friend from oclif! (./src/commands/hello/index.ts)
`,
];
Hello.flags = {
    from: core_1.Flags.string({ char: 'f', description: 'Who is saying hello', required: true }),
};
exports.default = Hello;
