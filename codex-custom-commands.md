# Custom Commands in Codex

## Can I Add Custom `/commands`?

Not currently as arbitrary custom slash commands.

Codex slash commands are a fixed built-in command set, such as:

- `/status`
- `/init`
- `/review`
- `/mcp`
- `/plan`
- `/model`
- `/side`

The official Codex CLI customization docs cover themes, shell completions, editor behavior, and shortcuts, but they do not document a supported way to register custom commands like `/tunnel`, `/deploy`, or `/my-workflow`.

The local CLI also does not expose a custom slash-command feature in `codex --help`.

Tested local version:

```text
codex-cli 0.149.1
```

## Best Alternative: Skills

For reusable workflows, use Codex skills instead of custom slash commands.

Skills are invoked with `$skill-name` or through the skills picker, not as `/skill-name`.

Typical structure:

```text
.agents/
  skills/
    share-local-app/
      SKILL.md
      scripts/
```

A skill can include:

- workflow instructions;
- project-specific conventions;
- references;
- optional scripts;
- checks and cleanup steps.

## Example

Instead of creating:

```text
/tunnel
```

Create a skill named:

```text
$share-local-app
```

That skill can tell Codex how to:

- start the local dev server;
- expose it through a tunnel;
- validate the public URL;
- report the access password if required;
- stop the tunnel cleanly afterward.

## When to Use What

Use built-in slash commands for controlling Codex itself.

Use skills for repeatable workflows that Codex should understand and execute.

Use shell scripts, npm scripts, or PowerShell scripts for deterministic commands that do not need agent reasoning.

Use plugins or MCP tools when the workflow needs a reusable integration with an external app, account, or service.

## Sources

- Codex developer commands: https://learn.chatgpt.com/docs/developer-commands?surface=cli
- CLI customization: https://learn.chatgpt.com/docs/cli-customization
- Build skills: https://learn.chatgpt.com/docs/build-skills

