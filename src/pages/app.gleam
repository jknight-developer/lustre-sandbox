import components/footer
import components/navbar
import gleam/dict
import gleam/result
import lustre/attribute
import lustre/element.{type Element}
import lustre/element/html
import lustre_sandbox/lib/msg.{type Msg}
import lustre_sandbox/lib/types.{type Model}
import pages/index
import pages/about
import pages/songs

pub fn app(model: Model) -> Element(Msg) {
  html.div([], [
    navbar.navbar(model),
    // Routing
    html.div(
      [
        attribute.style([
          #("width", "full"),
          #("margin", "0 auto"),
          #("padding", "2rem"),
          #(
            "background",
            result.unwrap(dict.get(model.state.inputs, "colour"), ""),
          ),
        ]),
      ],
      [
        case model.state.route {
          msg.Index -> index.index(model)
          msg.About -> about.about(model)
          msg.Songs -> songs.songs(model)
        },
      ],
    ),
    footer.footer(model),
  ])
}
