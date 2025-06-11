export interface MustacheStatement {
  type: "MustacheStatement";
  path: {
    original: string;
  };
}

interface ContentNode {
  type: "ContentStatement";
  value: string;
}

export interface ProgramNode {
  type: "Program";
  body: ASTNode[];
}

interface BlockStatement {
  type: "BlockStatement";
  body: ASTNode[];
}

interface PartialStatement {
  type: "PartialStatement";
}

interface CommentStatement {
  type: "CommentStatement";
}

export type ASTNode =
  | MustacheStatement
  | ContentNode
  | ProgramNode
  | BlockStatement
  | PartialStatement
  | CommentStatement;
