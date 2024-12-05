import lustre/element.{type Element}
import lustre/attribute
import lustre/element/html
import lustre_sandbox/msg.{type Msg}

pub type ImageRef {
  ImageRef(title: String, location: String)
}

pub fn to_imageref(title: String, location: String) -> ImageRef {
  ImageRef(title, location)
}

pub fn imageloader(image: ImageRef, width: Int, height: Int) -> Element(Msg) {
  html.div([attribute.style([#("display", "flex"), #("flex-grow", "4")])], [
    html.img([attribute.src(image.location), attribute.alt(image.title), attribute.width(width), attribute.height(height)]),
  ])
}

