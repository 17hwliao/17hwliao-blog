```text
package main

import (
	"bufio"
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"os"
	"strings"

	"github.com/cloudwego/eino-ext/components/model/ollama"
	"github.com/cloudwego/eino/schema"
)

type Translator struct {
	chatModel *ollama.ChatModel
}

func NewTranslator() (*Translator, error) {
	ctx := context.Background()
	chatModel, err := ollama.NewChatModel(ctx, &ollama.ChatModelConfig{
		BaseURL: "http://127.0.0.1:11434",
		Model:   "qwen2.5:7b",
		Options: &ollama.Options{
			Temperature: 0.3,
		},
	})
	if err != nil {
		return nil, fmt.Errorf("创建失败: %w", err)
	}
	return &Translator{chatModel: chatModel}, nil
}

// - 内部实现流式输出
func (t *Translator) TranslateStream(ctx context.Context, messages []*schema.Message) error {
	stream, err := t.chatModel.Stream(ctx, messages)
	if err != nil {
		return fmt.Errorf("流式创建失败: %w", err)
	}
	defer stream.Close()

	for {
		chunk, err := stream.Recv()
		if errors.Is(err, io.EOF) {
			break
		}
		if err != nil {
			return fmt.Errorf("接收失败: %w", err)
		}
		fmt.Print(chunk.Content)
	}
	fmt.Println()
	return nil
}

func main() {
	translator, err := NewTranslator()
	if err != nil {
		log.Fatalf("创建模型对象失败: %v", err)
	}

	reader := bufio.NewReader(os.Stdin)
	messages := []*schema.Message{
		schema.SystemMessage("你是一个专业的翻译助手。请根据用户指定的目标语言进行翻译，只返回翻译结果，不要解释。如果用户没有指定语言，自动判断：中文翻译成英文，英文翻译成中文。"),
	}

	for {
		fmt.Print("\n你（输入格式: 目标语言@原文，如 中文@hello）：")
		input, err := reader.ReadString('\n')
		if err != nil {
			fmt.Println("输入结束")
			break
		}
		userInput := strings.TrimSpace(input)

		if userInput == "exit" {
			fmt.Println("再见！")
			break
		}
		if userInput == "" {
			continue
		}

		targetLang, text := parseInput(userInput)
		if targetLang != "" {
			text = fmt.Sprintf("翻译为%s: %s", targetLang, text)
		}

		messages = append(messages, schema.UserMessage(text))

		fmt.Print("翻译：")
		if err := translator.TranslateStream(context.Background(), messages); err != nil {
			log.Printf("翻译失败: %v", err)
			messages = messages[:len(messages)-1]
			continue
		}
	}
}

// - 使用@ 实现分割 对话输入,规范格式
func parseInput(input string) (target, text string) {
	parts := strings.SplitN(input, "@", 2)
	if len(parts) == 2 {
		return strings.TrimSpace(parts[0]), strings.TrimSpace(parts[1])
	}
	return "", input
}

```
