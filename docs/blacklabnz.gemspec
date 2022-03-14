
# frozen_string_literal: true

Gem::Specification.new do |s|
  s.name          = 'blacklab'
  s.author='NeilXu'
  s.version       = '1.0.0'
  s.summary       = 'asdfasdf'

  s.platform = Gem::Platform::RUBY
  s.required_ruby_version = '> 2.4'
  s.add_runtime_dependency 'jekyll', '> 3.5', '< 5.0'
  s.add_runtime_dependency 'jekyll-seo-tag', '~> 2.0'
  s.add_runtime_dependency 'webrick', '~> 1.7'
  s.add_runtime_dependency 'jekyll-sitemap', '= 1.4.0'
end
