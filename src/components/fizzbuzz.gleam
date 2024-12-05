import gleam/int
import gleam/list
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html
import lustre/ui
import lustre/ui/centre
import lustre/ui/classes
import lustre_sandbox/msg.{type Msg}

pub fn fizzbuzz(num: Int) -> List(Element(Msg)) {
  [ui.centre([centre.inline()], html.div([attribute.style([#("display", "flex"), #("align-items", "center"), #("flex-wrap", "wrap"), #("gap", "10px")])], do_fizzbuzz(num, 1, [])))]
}

fn do_fizzbuzz(num: Int, acc: Int, textlist: List(Element(Msg))) -> List(Element(Msg)) {
  case acc {
    n if n == num + 1 -> textlist
    n if n >= 0 && n % 15 == 0 && n > 30 -> do_fizzbuzz(num, acc + 1, list.flatten([textlist, [ui.centre([], html.p([classes.text_5xl(), ], [element.text("SUPER FIZZBUZZ TIMES " <> int.to_string({n / 15} - 1) <> "!")]))]]))
    n if n >= 0 && n % 15 == 0 && n > 15 -> do_fizzbuzz(num, acc + 1, list.flatten([textlist, [ui.centre([], html.p([classes.text_3xl()], [element.text("SUPER FIZZBUZZ!")]))]]))
    n if n >= 0 && n % 15 == 0 -> do_fizzbuzz(num, acc + 1, list.flatten([textlist, [ui.centre([], html.p([classes.text_2xl()], [element.text("FIZZBUZZ!")]))]]))
    n if n >= 0 && n % 3 == 0 -> do_fizzbuzz(num, acc + 1, list.flatten([textlist, [html.div([], [element.text("fizz")])]]))
    n if n >= 0 && n % 5 == 0 -> do_fizzbuzz(num, acc + 1, list.flatten([textlist, [html.div([], [element.text("buzz")])]]))
    n if n >= 0 -> do_fizzbuzz(num, acc + 1, list.flatten([textlist, [html.div([], [element.text(int.to_string(acc))])]]))
    _ -> panic
  }
}

